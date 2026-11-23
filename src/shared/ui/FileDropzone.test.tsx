import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { FileDropzone } from './FileDropzone'

const png = (name = 'plant.png', size = 2048) =>
  new File([new Uint8Array(size)], name, { type: 'image/png' })

function Harness({ disabled = false, imageUrl }: { disabled?: boolean; imageUrl?: string }) {
  const [file, setFile] = useState<File>()
  return (
    <>
      <label htmlFor="zone">Whole plant</label>
      <FileDropzone
        id="zone"
        accept={['image/png', 'image/jpeg']}
        note="JPEG or PNG, up to 10 MB"
        disabled={disabled}
        file={file}
        imageUrl={imageUrl}
        onFile={setFile}
      />
    </>
  )
}

describe('FileDropzone', () => {
  it('invites to drop or browse and says what is accepted', () => {
    render(<Harness />)

    expect(screen.getByText(/Drop your photo here, or/)).toBeInTheDocument()
    expect(screen.getByText('browse')).toBeInTheDocument()
    expect(screen.getByText('JPEG or PNG, up to 10 MB')).toBeInTheDocument()
  })

  it('stays a labelled file input that takes a chosen file and shows its name and size', async () => {
    render(<Harness />)
    await userEvent.upload(screen.getByLabelText('Whole plant'), png('rose.png', 2048))

    expect(screen.getByText('rose.png · 2 KB')).toBeInTheDocument()
    expect(screen.queryByText(/Drop your photo here/)).not.toBeInTheDocument()
  })

  it('takes a file that is dropped on it, and lights up while one is dragged over', () => {
    render(<Harness />)
    const zone = screen.getByText(/Drop your photo here/).closest('div') as HTMLElement

    fireEvent.dragOver(zone)
    expect(zone).toHaveAttribute('data-over', 'true')
    fireEvent.dragLeave(zone)
    expect(zone).toHaveAttribute('data-over', 'false')

    fireEvent.drop(zone, { dataTransfer: { files: [png('dropped.png')] } })
    expect(screen.getByText('dropped.png · 2 KB')).toBeInTheDocument()
  })

  it('removes the chosen file and returns to the invitation', async () => {
    render(<Harness />)
    await userEvent.upload(screen.getByLabelText('Whole plant'), png())
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(screen.getByText(/Drop your photo here/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
  })

  it('shows a photo that is already there and offers to replace it', () => {
    const { container } = render(<Harness imageUrl="http://storage.test/view" />)

    expect(container.querySelector('img')).toHaveAttribute('src', 'http://storage.test/view')
    expect(screen.getByText(/Drop a new photo here, or/)).toBeInTheDocument()
  })

  it('does not take a file while it is disabled', () => {
    render(<Harness disabled />)
    const zone = screen.getByText(/Drop your photo here/).closest('div') as HTMLElement

    fireEvent.drop(zone, { dataTransfer: { files: [png('late.png')] } })
    expect(screen.queryByText(/late.png/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Whole plant')).toBeDisabled()
  })
})
